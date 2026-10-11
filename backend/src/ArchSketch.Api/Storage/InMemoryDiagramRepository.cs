namespace ArchSketch.Api.Storage;

/// <summary>
/// ストレージとしてメモリを使用する開発用リポジトリ。
/// SQL Server を用意せずにアプリ全体を動作させるためのフォールバックであり、
/// プロセス再起動でデータは失われる。
/// </summary>
public sealed class InMemoryDiagramRepository : IDiagramRepository
{
    private readonly object _gate = new();
    private readonly Dictionary<Guid, Diagram> _store = [];

    public Task<IReadOnlyList<DiagramSummary>> ListAsync(CancellationToken cancellationToken = default)
    {
        lock (_gate)
        {
            var summaries = _store.Values
                .Select(d => new DiagramSummary(d.Id, d.Name, d.CreatedAtUtc, d.UpdatedAtUtc, d.ContentJson.Length))
                .OrderByDescending(d => d.UpdatedAtUtc)
                .ToList();
            return Task.FromResult<IReadOnlyList<DiagramSummary>>(summaries);
        }
    }

    public Task<Diagram?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_gate)
        {
            return Task.FromResult(_store.TryGetValue(id, out var diagram) ? Clone(diagram) : null);
        }
    }

    public Task<Diagram> CreateAsync(string name, string contentJson, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var diagram = new Diagram(Guid.NewGuid(), name, contentJson, now, now);
        lock (_gate)
        {
            _store[diagram.Id] = Clone(diagram);
        }
        return Task.FromResult(diagram);
    }

    public Task<Diagram> UpdateAsync(Guid id, string name, string contentJson, CancellationToken cancellationToken = default)
    {
        lock (_gate)
        {
            if (!_store.TryGetValue(id, out var existing))
            {
                throw new KeyNotFoundException($"Diagram {id} was not found.");
            }
            var updated = existing with { Name = name, ContentJson = contentJson, UpdatedAtUtc = DateTimeOffset.UtcNow };
            _store[id] = Clone(updated);
            return Task.FromResult(updated);
        }
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_gate)
        {
            return Task.FromResult(_store.Remove(id));
        }
    }

    public Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default) => Task.FromResult(true);

    private static Diagram Clone(Diagram diagram) => diagram with { };
}
