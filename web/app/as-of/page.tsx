export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Ledger As-Of</h1>
      <form className="flex gap-4">
        <input type="datetime-local" className="border p-2 rounded text-black" />
        <button type="submit" disabled className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">
          Submit
        </button>
      </form>
    </main>
  );
}
