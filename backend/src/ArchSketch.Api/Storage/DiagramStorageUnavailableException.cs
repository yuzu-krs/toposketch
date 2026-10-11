using Microsoft.Data.SqlClient;

namespace ArchSketch.Api.Storage;

/// <summary>SQL Server に接続できない等、ストレージ層が利用不可の状態を表す例外。</summary>
public sealed class DiagramStorageUnavailableException : Exception
{
    public DiagramStorageUnavailableException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }

    public static DiagramStorageUnavailableException Wrap(SqlException ex) => new(
        "SQL Server に接続できませんでした。接続文字列（ConnectionStrings:ArchSketch）と SQL Server の状態を確認してください。" +
        "SQL Server を使用しない場合は appsettings.json の Storage:Provider を InMemory にしてください。",
        ex);
}
