using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs
{
    /// <summary>
    /// قناة SignalR للتنبيهات الفورية.
    /// M9: جميع الرسائل تُرسل فقط من الخادم عبر IHubContext — لا توجد دوال قابلة للاستدعاء من العميل.
    /// </summary>
    [Authorize]
    public class AlertHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            // يمكن إضافة منطق لتتبع المستخدمين النشطين هنا
            await base.OnConnectedAsync();
        }

        // M9: تم حذف SendNotification و UpdateUnreadCount — كانت قابلة للاستدعاء
        // من أي عميل مصادق (ثغرة أمنية). الإرسال يتم حصرياً من الخادم عبر IHubContext.
    }
}
