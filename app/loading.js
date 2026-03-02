export default function Loading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--gray-50)" }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "4px solid var(--primary-200)",
        borderTop: "4px solid var(--primary-600)",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
