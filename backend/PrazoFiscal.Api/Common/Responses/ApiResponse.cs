namespace PrazoFiscal.Api.Common.Responses;

public class ApiResponse<T>
{
    public bool Success { get; init; } = true;
    public string? Message { get; init; }
    public T? Data { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message) =>
        new() { Success = false, Message = message };
}

public class ApiListResponse<T> : ApiResponse<List<T>>
{
    public static ApiListResponse<T> Ok(List<T> data) =>
        new() { Success = true, Data = data };
}
