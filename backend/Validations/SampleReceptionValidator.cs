using FluentValidation;
using backend.Models;

namespace backend.Validations
{
    public class SampleReceptionValidator : AbstractValidator<SampleReception>
    {
        public SampleReceptionValidator()
        {
            RuleFor(x => x.Date)
                .NotEmpty().WithMessage("تاريخ الاستلام مطلوب.")
                .LessThanOrEqualTo(System.DateTime.UtcNow).WithMessage("تاريخ الاستلام لا يمكن أن يكون في المستقبل.");

            RuleFor(x => x.Sender)
                .NotEmpty().WithMessage("الجهة المرسلة مطلوبة.")
                .MaximumLength(200).WithMessage("اسم الجهة المرسلة لا يجب أن يتجاوز 200 حرف.");

            RuleFor(x => x.CertificateType)
                .NotEmpty().WithMessage("نوع الشهادة مطلوب.");

            RuleFor(x => x.Samples)
                .NotEmpty().WithMessage("يجب إضافة عينة واحدة على الأقل.");

            RuleForEach(x => x.Samples).SetValidator(new ReceptionSampleValidator());
        }
    }

    public class ReceptionSampleValidator : AbstractValidator<ReceptionSample>
    {
        public ReceptionSampleValidator()
        {
            RuleFor(x => x.Root)
                .NotEmpty().WithMessage("الجذر مطلوب.")
                .MaximumLength(100).WithMessage("الجذر لا يجب أن يتجاوز 100 حرف.");

            RuleFor(x => x.SampleNumber)
                .NotEmpty().WithMessage("رقم العينة مطلوب.")
                .MaximumLength(50).WithMessage("رقم العينة لا يجب أن يتجاوز 50 حرف.");
        }
    }
}
