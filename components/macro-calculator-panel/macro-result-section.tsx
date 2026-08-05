"use client";

export function MacroResultSection({ error, signedIn, planLoading }: { error: string | null; signedIn: boolean; planLoading: boolean }) {
  return (
    <>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {!signedIn ? <p className="mt-2 text-sm text-muted-foreground">Đăng nhập để lưu macro / Sign in to save macro targets.</p> : null}
      {planLoading ? <p className="mt-2 text-sm text-muted-foreground">Đang tải mục tiêu đã lưu gần nhất / Loading latest saved macro target...</p> : null}
    </>
  );
}
