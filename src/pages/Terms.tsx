
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Terms = () => {
  const { t, language } = useLanguage();
  
  const termsContent = {
    en: {
      title: "Terms of Service",
      sections: [
        {
          title: "Information Collection",
          content: "We don't need your personal data. We do not collect any personal information other than what is necessary for the functioning of the forum."
        },
        {
          title: "Data Security",
          content: "All data is encrypted and even the admin cannot access it, so if something happens, they won't be able to recover it. We use modern encryption methods to protect your information."
        },
        {
          title: "Owner",
          content: "This forum belongs to \"Liveone-two Baneronetwo\" as an open and free forum. We strive to create a space for the free exchange of ideas and information."
        }
      ]
    },
    uk: {
      title: "Умови використання",
      sections: [
        {
          title: "Збір інформації",
          content: "Нам не потрібні ваші персональні дані. Ми не збираємо жодної особистої інформації, окрім тієї, яка необхідна для функціонування форуму."
        },
        {
          title: "Безпека даних",
          content: "Всі дані шифруються і навіть адміністратор не має доступу до них, тому якщо щось трапиться, він не зможе їх відновити. Ми використовуємо сучасні методи шифрування для захисту вашої інформації."
        },
        {
          title: "Власник",
          content: "Цей форум належить \"Liveone-two Baneronetwo\" як відкритий і вільний форум. Ми прагнемо створити простір для вільного обміну ідеями та інформацією."
        }
      ]
    },
    de: {
      title: "Nutzungsbedingungen",
      sections: [
        {
          title: "Informationssammlung",
          content: "Wir benötigen Ihre persönlichen Daten nicht. Wir sammeln keine persönlichen Informationen, außer denen, die für die Funktion des Forums notwendig sind."
        },
        {
          title: "Datensicherheit",
          content: "Alle Daten sind verschlüsselt und selbst der Administrator kann nicht darauf zugreifen. Wenn also etwas passiert, kann er sie nicht wiederherstellen. Wir verwenden moderne Verschlüsselungsmethoden zum Schutz Ihrer Informationen."
        },
        {
          title: "Eigentümer",
          content: "Dieses Forum gehört \"Liveone-two Baneronetwo\" als offenes und freies Forum. Wir bemühen uns, einen Raum für den freien Austausch von Ideen und Informationen zu schaffen."
        }
      ]
    },
    ru: {
      title: "Условия использования",
      sections: [
        {
          title: "Сбор информации",
          content: "Нам нахер не нужны ваши данные. Мы не собираем никакой личной информации, кроме той, которая необходима для функционирования форума."
        },
        {
          title: "Безопасность данных",
          content: "Все данные шифруются и даже админ пидарас не может получить доступ, по этому если что-то случится, он не сможет восстановить. Мы используем современные методы шифрования для защиты вашей информации."
        },
        {
          title: "Владелец",
          content: "Форум принадлежит \"Liveone-two Baneronetwo\", как открытый и свободный форум. Мы стремимся создать пространство для свободного обмена идеями и информацией."
        }
      ]
    }
  };
  
  // Default to current language or fall back to Russian if not available
  const currentContent = termsContent[language as keyof typeof termsContent] || termsContent.en;
  
  return (
    <div className="container max-w-3xl mx-auto py-12">
      <Button
        variant="outline"
        className="mb-8"
        asChild
      >
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.common?.back || 'Back to home'}
        </Link>
      </Button>

      <div className="space-y-6">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-blue">{currentContent.title}</h1>
        
        <Tabs defaultValue={language} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="uk">Українська</TabsTrigger>
            <TabsTrigger value="de">Deutsch</TabsTrigger>
            <TabsTrigger value="ru">Русский</TabsTrigger>
          </TabsList>
          
          {Object.entries(termsContent).map(([lang, content]) => (
            <TabsContent key={lang} value={lang} className="mt-0">
              <div className="neon-card p-6 space-y-8">
                {content.sections.map((section, index) => (
                  <section key={index} className="space-y-4">
                    <h2 className="text-2xl font-semibold text-neon-blue">{section.title}</h2>
                    <p className="text-muted-foreground">{section.content}</p>
                  </section>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Terms;
