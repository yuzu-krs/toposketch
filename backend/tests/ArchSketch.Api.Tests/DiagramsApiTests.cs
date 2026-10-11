using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace ArchSketch.Api.Tests;

public sealed class DiagramsApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public DiagramsApiTests(WebApplicationFactory<Program> factory)
    {
        // テストは常に InMemory ストレージで実行する（SQL Server に依存しない）。
        _factory = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("Storage:Provider", "InMemory"));
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Health_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Post_ThenGet_RoundTripsDocument()
    {
        var content = """{"schema":1,"name":"サンプル","nodes":[],"edges":[],"groups":[]}""";
        var create = await _client.PostAsJsonAsync("/api/diagrams", new { name = "サンプル", contentJson = content });

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = await create.Content.ReadFromJsonAsync<DiagramDto>(Json);
        Assert.NotNull(created);
        Assert.Equal("サンプル", created!.Name);
        Assert.Equal(content, created.ContentJson);
        Assert.Equal($"/api/diagrams/{created.Id}", create.Headers.Location?.AbsolutePath);

        var get = await _client.GetAsync($"/api/diagrams/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var loaded = await get.Content.ReadFromJsonAsync<DiagramDto>(Json);
        Assert.Equal(created.Id, loaded!.Id);
        Assert.Equal(content, loaded.ContentJson);
    }

    [Fact]
    public async Task Put_UpdatesDocument()
    {
        var created = await CreateDiagramAsync("変更前");

        var update = await _client.PutAsJsonAsync($"/api/diagrams/{created!.Id}",
            new { name = "変更後", contentJson = """{"schema":1,"nodes":[{"id":"n1"}]}""" });

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var updated = await update.Content.ReadFromJsonAsync<DiagramDto>(Json);
        Assert.Equal("変更後", updated!.Name);
        Assert.Contains("n1", updated.ContentJson);
    }

    [Fact]
    public async Task Put_MissingId_Returns404()
    {
        var update = await _client.PutAsJsonAsync($"/api/diagrams/{Guid.NewGuid()}",
            new { name = "x", contentJson = "{}" });
        Assert.Equal(HttpStatusCode.NotFound, update.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesDocument()
    {
        var created = await CreateDiagramAsync("削除対象");
        Assert.NotNull(created);

        var delete = await _client.DeleteAsync($"/api/diagrams/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var getAfterDelete = await _client.GetAsync($"/api/diagrams/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getAfterDelete.StatusCode);

        var deleteAgain = await _client.DeleteAsync($"/api/diagrams/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, deleteAgain.StatusCode);
    }

    [Fact]
    public async Task Get_MissingId_Returns404()
    {
        var response = await _client.GetAsync($"/api/diagrams/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_List_ReturnsSummariesNewestFirst()
    {
        var first = await CreateDiagramAsync("一覧テスト1");
        await Task.Delay(10);
        await CreateDiagramAsync("一覧テスト2");

        var list = await _client.GetFromJsonAsync<List<DiagramSummaryDto>>("/api/diagrams", Json);

        Assert.NotNull(list);
        var names = list!.Select(s => s.Name).ToList();
        Assert.Contains("一覧テスト2", names);
        Assert.Contains("一覧テスト1", names);
        Assert.True(names.IndexOf("一覧テスト2") < names.IndexOf("一覧テスト1"));
        Assert.All(list, s => Assert.Equal(0, s.ContentLengthChars % 1)); // ContentLengthChars は long
    }

    [Theory]
    [InlineData(null, "{}", "name は必須です")]
    [InlineData("", "{}", "name は必須です")]
    [InlineData("テスト", "not-json", "有効な JSON")]
    [InlineData("テスト", null, "contentJson は必須です")]
    public async Task Post_InvalidPayload_Returns400WithDetail(string? name, string? content, string expectedFragment)
    {
        var create = await _client.PostAsJsonAsync("/api/diagrams", new { name, contentJson = content });

        Assert.Equal(HttpStatusCode.BadRequest, create.StatusCode);
        var body = await create.Content.ReadAsStringAsync();
        Assert.Contains(expectedFragment, body);
    }

    private async Task<DiagramDto?> CreateDiagramAsync(string name)
    {
        var create = await _client.PostAsJsonAsync("/api/diagrams",
            new { name, contentJson = """{"schema":1,"nodes":[],"edges":[],"groups":[]}""" });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        return await create.Content.ReadFromJsonAsync<DiagramDto>(Json);
    }

    private sealed record DiagramDto(Guid Id, string Name, string ContentJson, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc);

    private sealed record DiagramSummaryDto(Guid Id, string Name, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc, long ContentLengthChars);
}
