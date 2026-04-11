import { 
  ShieldCheck, 
  BarChart3, 
  Cpu, 
  Zap, 
  Users, 
  Globe, 
  Mail, 
  Phone, 
  Award,
  Clock
} from 'lucide-react';

export const aboutData = {
  system: {
    name: "منظومة إنجاز ويب",
    version: "v1.0.0 Enterprise",
    subtitle: "حلول مؤسسية متكاملة لإدارة عينات وشهادات القياس الإشعاعي",
    description: "تمثل 'إنجاز ويب' الجيل الجديد من أنظمة التحول الرقمي الصارم، المصممة خصيصاً للتغلب على التحديات البيروقراطية والبطء في معالجة العينات الإشعاعية. توفر المنظومة بيئة تقنية متطورة تعتمد على الأتمتة الكاملة والتحقق متعدد الطبقات لضمان أعلى مستويات الدقة والموثوقية.",
    branding: {
       enjazLogo: "/assets/enjaz_3d_icon_transparent.png",
       designerLogo: "/assets/designer_logo.png"
    }
  },
  
  features: [
    {
      title: "تحقق متعدد الطبقات",
      description: "نظام رياضي مدمج يقوم بالتحقق من صحة البيانات في كل مرحلة (استلام، فحص، إصدار) لتقليل التدخل البشري وضمان سلامة المخرجات.",
      icon: ShieldCheck,
      color: "emerald"
    },
    {
      title: "أتمتة شاملة",
      description: "تحويل المسار الورقي التقليدي إلى دورة حياة رقمية تبدأ من الباركود وتنتهي بإصدار الشهادات المعتمدة بنقرة زر واحدة.",
      icon: Zap,
      color: "amber"
    },
    {
      title: "تحليل ذكي",
      description: "لوحات معلومات (Dashboards) تفاعلية تقدم إحصائيات فورية حول معدلات الإنجاز، توزيع العينات، والأداء العام للمختبر.",
      icon: BarChart3,
      color: "indigo"
    },
    {
      title: "تشفير QR موثق",
      description: "كل شهادة تصدر تحمل رمز استجابة سريعة (QR) مشفر، يسمح للجهات الرقابية بالتحقق من صحة البيانات فورياً بطريقة آمنة.",
      icon: Cpu,
      color: "purple"
    }
  ],


  timeline: [
    { year: "2023", event: "إطلاق نسخة Desktop الأولية" },
    { year: "2025", event: "تعزيز خوارزميات القياس الإشعاعي" },
    { year: "2026", event: "الإطلاق الكامل لنسخة الويب المتطورة" }
  ],

  developer: {
    name: "م. إدريس فتح الله الهرى",
    title: "مطور أنظمة مدعوم بالذكاء الاصطناعي (AI-powered software developer)",
    bio: "متخصص في تصميم وتطوير الأنظمة المؤسسية المعقدة التي تهدف إلى أتمتة الإجراءات الحرجة ورفع كفاءة الأداء الرقمي.",
    contact: {
      email: "edreeselhery@gmail.com",
      phone: "0925126355 / 0917730110",
      links: [
        { name: "LinkedIn", url: "https://linkedin.com/in/edrees", icon: Award },
        { name: "GitHub", url: "https://github.com/edrees-76", icon: Globe }
      ]
    }
  }
};
