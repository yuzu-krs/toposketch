using ArchSketch.Api.Storage;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins("http://localhost:4200", "http://127.0.0.1:4200")
          .AllowAnyHeader()
          .AllowAnyMethod()));

var storageProvider = builder.Services.AddDiagramStorage(builder.Configuration);

var app = builder.Build();

app.Logger.LogInformation("ArchSketch API starting. Storage provider: {StorageProvider}", storageProvider);

app.UseCors("Frontend");

app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, title, detail) = exception switch
    {
        KeyNotFoundException => (StatusCodes.Status404NotFound, "リソースが見つかりません", exception.Message),
        DiagramStorageUnavailableException => (
            StatusCodes.Status503ServiceUnavailable,
            "データベースに接続できません",
            exception.Message),
        _ => (
            StatusCodes.Status500InternalServerError,
            "サーバーエラー",
            app.Environment.IsDevelopment() ? exception?.ToString() ?? "unknown error" : "サーバー内部でエラーが発生しました。"),
    };

    context.Response.StatusCode = status;
    context.Response.ContentType = "application/problem+json";
    await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title, Detail = detail });
}));

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();
app.Run();

/// <summary>統合テスト（WebApplicationFactory）から参照できるよう公開。</summary>
public partial class Program;
