"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  // id도 포함!
  const [data, setData] = useState<{ id: number; name: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginInfo, setLoginInfo] = useState({ email: "", password: "" });
  // 토큰을 위한 state 추가
  const [token, setToken] = useState<string | null>(null);
  // 인증 확인 중인지 나타내는 state 추가
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const tryRefresh = async () => {
      setIsCheckingAuth(true);
      try {
        const res = await fetch("http://localhost:3001/auths/refresh", {
          method: "POST",
          credentials: "include", // 쿠키 인증 유지
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          setUser(null);
          setToken(null);
          setIsCheckingAuth(false);
          return;
        }
        const result = await res.json();
        if (result && result.data) {
          setToken(result.data);
          // 토큰이 세팅되면 /users/me 호출
          try {
            const userRes = await fetch("http://localhost:3001/users/me", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${result.data}`,
              },
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              // userData가 { email, ... } 타입이라고 가정
              if (userData && userData.data) {
                setUser(userData.data);
              }
            } else {
              setUser(null);
            }
          } catch (err) {
            setUser(null);
          }
        }
      } catch (error) {
        setUser(null);
        setToken(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    tryRefresh();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3001/auths/login", {
        method: "POST",
        // 쿠키 인증을 위해 credentials 옵션 사용
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginInfo.email,
          password: loginInfo.password,
        }),
      });
      if (!res.ok) {
        throw new Error("로그인 실패");
      }
      const result = await res.json();
      console.log(result);
      setUser({ email: loginInfo.email });
      if (result && result.data) {
        setToken(result.data); // 토큰 저장
      }
      // You may want to handle authentication token here
    } catch (error) {
      alert("로그인에 실패했습니다.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null); // 로그아웃시 토큰 초기화
  };

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/guns", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("데이터 요청 실패");
      const result = await res.json();
      // result.data가 [{ id, name }, ...] 형태임을 감안
      if (result && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        setData(null);
      }
    } catch (error) {
      alert("데이터 요청에 실패했습니다.");
      setData(null);
    }
    setLoading(false);
  };

  // 인증 확인 중일 때는 아무것도 렌더링하지 않음 (FOUC 방지)
  if (isCheckingAuth) {
    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .spinner {
              border: 3px solid #f3f3f3;
              border-top: 3px solid #3182f6;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
            }
          `,
          }}
        />
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            backgroundColor: "var(--background, #ffffff)",
            color: "var(--foreground, #171717)",
            zIndex: 9999,
            margin: 0,
            padding: 0,
          }}
        >
          <div className="spinner" />
          <span style={{ color: "#666", fontSize: "1rem", fontFamily: "Arial, Helvetica, sans-serif" }}>확인 중...</span>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header with login UI */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", borderBottom: "1px solid #eee" }}>
        <h2>My App</h2>
        <div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>환영합니다, {user.email}님!</span>
              <button onClick={handleLogout} style={{ padding: "0.3rem 0.7rem" }}>
                로그아웃
              </button>
              {token && <span style={{ fontSize: 11, color: "#444", marginLeft: 12, background: "#f7f7f7", borderRadius: 5, padding: "2px 8px" }}>Token: {token.slice(0, 12)}...</span>}
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleLogin();
              }}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="email"
                placeholder="이메일"
                style={{ padding: "0.3rem 0.7rem", border: "1px solid #bbb", borderRadius: 3 }}
                required
                value={loginInfo.email}
                onChange={(e) => setLoginInfo((info) => ({ ...info, email: e.target.value }))}
              />
              <input
                type="password"
                placeholder="비밀번호"
                style={{ padding: "0.3rem 0.7rem", border: "1px solid #bbb", borderRadius: 3 }}
                required
                value={loginInfo.password}
                onChange={(e) => setLoginInfo((info) => ({ ...info, password: e.target.value }))}
              />
              <button type="submit" style={{ padding: "0.3rem 0.7rem" }}>
                로그인
              </button>
            </form>
          )}
        </div>
      </header>
      {/* Main: Fetch and display data */}
      <main style={{ maxWidth: 500, margin: "2rem auto", textAlign: "center" }}>
        <button
          onClick={handleFetchData}
          disabled={loading}
          style={{
            marginBottom: "2rem",
            padding: "0.7rem 2rem",
            borderRadius: 5,
            border: "none",
            background: "#3182f6",
            color: "white",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "불러오는 중..." : "데이터 가져오기"}
        </button>
        <div>
          {data && (
            <ul style={{ listStyle: "none", padding: 0, marginTop: "2rem" }}>
              {data.map((item) => (
                <li
                  key={item.id}
                  style={{
                    background: "#f3f5fa",
                    margin: "0.7rem auto",
                    padding: "1rem",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    fontSize: "1.15rem",
                  }}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
