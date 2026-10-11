namespace ArchSketch.Api.Services;

/// <summary>システム状態のレポート。</summary>
public sealed record HealthStatus(bool Healthy, string StorageProvider);

/// <summary>ヘルスチェックの業務ロジック抽象。</summary>
public interface IHealthService
{
    Task<HealthStatus> GetAsync(CancellationToken cancellationToken = default);
}
