export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Asset: {id}</h1>
      <p>{/* TODO: history goes here */}</p>
      <p>history goes here</p>
    </main>
  );
}
