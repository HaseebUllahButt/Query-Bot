export default function QueryResult({ sqlQuery }: { sqlQuery: string }) {
  return (
    <div>
      <h3 className="text-black">Generated SQL:</h3>
      <pre className="text-black">{sqlQuery}</pre>
    </div>
  );
}
