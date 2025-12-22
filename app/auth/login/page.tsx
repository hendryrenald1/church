import { LoginForm } from "@/components/auth/login-form";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@radix-ui/react-icons";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center overflow-hidden bg-background lg:grid-cols-[1fr_420px]">
        <main className="flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <LoginForm />
        </main>
        <aside className="hidden h-full flex-col justify-between bg-muted/70 p-10 text-foreground lg:flex">
          <div className="flex flex-col gap-6">
            <Badge variant="outline" className="w-fit border-green-600 bg-green-50 text-green-700">
              Secure Church Workspace
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-medium tracking-tight">Designed for Ministry</h1>
              <p className="text-muted-foreground">
                A calm, focused, and private workspace to help you serve your congregation.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium">What you can do here:</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>
                  <strong>Manage members & families</strong>
                  <br />
                  Keep track of your congregation and their connections.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>
                  <strong>Track attendance & engagement</strong>
                  <br />
                  Gain insights into participation across services and groups.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>
                  <strong>Oversee multiple branches</strong>
                  <br />
                  Manage permissions and data for each campus from one place.
                </span>
              </li>
            </ul>
          </div>

          <footer className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Your Church Name. All rights reserved.
          </footer>
        </aside>
      </div>
    </div>
  );
}
