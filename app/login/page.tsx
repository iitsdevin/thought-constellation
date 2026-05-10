import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params?.next?.startsWith("/") ? params.next : "/";

  return (
    <section className="login-shell">
      <LoginForm nextPath={nextPath} />
    </section>
  );
}
