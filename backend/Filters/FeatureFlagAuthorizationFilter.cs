using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

namespace backend.Filters
{
    public class FeatureFlagAuthorizationFilter : IAsyncAuthorizationFilter
    {
        private readonly IConfiguration _configuration;

        public FeatureFlagAuthorizationFilter(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var enableAuth = _configuration.GetValue<bool>("Features:EnableAuth");

            if (!enableAuth)
            {
                // Authorization is disabled globally via settings, bypass auth logic
                return Task.CompletedTask;
            }

            // Also skip authorization if action has [AllowAnonymous]
            var hasAllowAnonymous = context.ActionDescriptor.EndpointMetadata
                .Any(em => em.GetType() == typeof(AllowAnonymousAttribute));

            if (hasAllowAnonymous)
            {
                return Task.CompletedTask;
            }

            if (context.HttpContext.User?.Identity?.IsAuthenticated != true)
            {
                context.Result = new UnauthorizedResult();
            }

            return Task.CompletedTask;
        }
    }
}
