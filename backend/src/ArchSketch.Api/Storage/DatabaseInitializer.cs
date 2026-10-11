using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;

namespace ArchSketch.Api.Storage;

/// <summary>
/// SQL Server をストレージに使う際、起動時に db/*.sql（埋め込みリソース）を
/// 冪等に実行してデータベース・テーブル・ストアドプロシージャを整える初期化処理。
/// 手動でスクリプトを実行済みの場合は何も変更しない。
/// </summary>
public static partial class DatabaseInitializer
{
    public static void Initialize(string connectionString, ILogger? logger = null)
    {
        // データベース作成前は master に接続する必要があるため、カタログを差し替える。
        var masterBuilder = new SqlConnectionStringBuilder(connectionString) { InitialCatalog = "master" };
        using var connection = new SqlConnection(masterBuilder.ConnectionString);
        connection.Open();

        foreach (var (name, sql) in LoadEmbeddedScripts())
        {
            logger?.LogInformation("Executing database script {ScriptName} ...", name);
            foreach (var batch in SplitBatches(sql))
            {
                using var command = new SqlCommand(batch, connection);
                command.ExecuteNonQuery();
            }
        }
    }

    private static IEnumerable<(string Name, string Sql)> LoadEmbeddedScripts()
    {
        var assembly = typeof(DatabaseInitializer).Assembly;
        var names = assembly.GetManifestResourceNames()
            .Where(n => n.EndsWith(".sql", StringComparison.OrdinalIgnoreCase))
            .OrderBy(n => n, StringComparer.Ordinal);

        foreach (var name in names)
        {
            using var stream = assembly.GetManifestResourceStream(name)
                ?? throw new InvalidOperationException($"Embedded script {name} was not found.");
            using var reader = new StreamReader(stream, Encoding.UTF8);
            yield return (name, reader.ReadToEnd());
        }
    }

    /// <summary>sqlcmd 用の GO 区切りをバッチ単位に分割する。</summary>
    internal static IEnumerable<string> SplitBatches(string script) =>
        GoSeparatorRegex()
            .Split(script)
            .Where(batch => !string.IsNullOrWhiteSpace(batch))
            .Select(batch => batch.Trim());

    [GeneratedRegex(@"(?im)^\s*GO\s*$")]
    private static partial Regex GoSeparatorRegex();
}
