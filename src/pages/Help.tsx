import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  MessageCircle, 
  Book, 
  Video, 
  Mail, 
  Phone, 
  ExternalLink,
  Search,
  FileText,
  Users,
  Settings,
  BarChart3
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";

const Help = () => {
  const { t } = useTranslation();
  usePageTitle('common.help', 'Help');

  const helpCategories = [
    {
      title: "Getting Started",
      description: "Learn the basics of using LocalFishing",
      icon: Book,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      articles: [
        "Setting up your account",
        "Adding your first products",
        "Managing inventory",
        "Creating your first sale"
      ]
    },
    {
      title: "Sales & Transactions",
      description: "Master sales management and transactions",
      icon: BarChart3,
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      articles: [
        "Processing sales",
        "Managing transactions",
        "Handling refunds",
        "Payment methods"
      ]
    },
    {
      title: "Reports & Analytics",
      description: "Understanding your business data",
      icon: FileText,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      articles: [
        "Generating reports",
        "Understanding analytics",
        "Export data",
        "Custom reports"
      ]
    },
    {
      title: "User Management",
      description: "Managing staff and permissions",
      icon: Users,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      articles: [
        "Adding staff members",
        "Setting permissions",
        "User roles",
        "Access control"
      ]
    }
  ];

  const quickActions = [
    {
      title: "Search Help Articles",
      description: "Find answers quickly",
      icon: Search,
      action: "Search"
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
      icon: Video,
      action: "Watch"
    },
    {
      title: "Contact Support",
      description: "Get help from our team",
      icon: MessageCircle,
      action: "Contact"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('common.help', 'Help')}</h1>
            <p className="text-muted-foreground">
              Find answers, tutorials, and get support for LocalFishing
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            24/7 Support Available
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <action.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {action.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {helpCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm h-8 px-2"
                      >
                        <HelpCircle className="h-3 w-3 mr-2" />
                        {article}
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Need More Help?
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">support@localfishing.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Phone Support</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Help;
