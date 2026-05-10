import CategoryDetail from "./CategoryDetail";

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoryDetail id={id} />;
}
