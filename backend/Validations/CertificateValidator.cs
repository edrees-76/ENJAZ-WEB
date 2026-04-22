using FluentValidation;
using backend.Models;

namespace backend.Validations
{
    public class CertificateValidator : AbstractValidator<Certificate>
    {
        public CertificateValidator()
        {
            RuleFor(x => x.CertificateType)
                .NotEmpty().WithMessage("نوع الشهادة مطلوب.");

            RuleFor(x => x.IssueDate)
                .NotEmpty().WithMessage("تاريخ الإصدار مطلوب.");

            RuleFor(x => x.Sender)
                .NotEmpty().WithMessage("الجهة المرسلة مطلوبة.");

            RuleFor(x => x.AnalysisType)
                .NotEmpty().WithMessage("نوع التحليل مطلوب.");

            RuleFor(x => x.Samples)
                .NotEmpty().WithMessage("يجب إضافة عينة واحدة على الأقل.");

            RuleForEach(x => x.Samples).SetValidator(new SampleValidator());
        }
    }

    public class SampleValidator : AbstractValidator<Sample>
    {
        public SampleValidator()
        {
            RuleFor(x => x.Root)
                .NotEmpty().WithMessage("الجذر مطلوب.");

            RuleFor(x => x.SampleNumber)
                .NotEmpty().WithMessage("رقم العينة مطلوب.");

            RuleFor(x => x.MeasurementDate)
                .NotEmpty().WithMessage("تاريخ القياس مطلوب لكل عينة.");

            RuleFor(x => x.Result)
                .NotEmpty().WithMessage("نتيجة التحليل مطلوبة لكل عينة.");
        }
    }
}
