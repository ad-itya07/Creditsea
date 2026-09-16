export function Notice({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "success" | "error";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    success: "border-green-200 bg-green-50 text-green-900",
    error: "border-red-200 bg-red-50 text-red-900",
  };

  return (
    <div className={`rounded-md border p-3 text-sm ${styles[type]}`}>
      {title ? <p className="mb-1 font-medium">{title}</p> : null}
      {children}
    </div>
  );
}
