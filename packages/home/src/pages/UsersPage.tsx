import { User } from 'lucide-react';
import { NotAvailableInOss } from '../blocks/NotAvailableInOss';

/**
 * UsersPage — placeholder for OSS. End-user management (multi-tenant user
 * directory across channels) is a cloud-only feature today.
 */
export function UsersPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-6">
        <User className="h-4 w-4" />
        <h1 className="text-base font-semibold sm:text-lg">Users</h1>
      </div>
      <NotAvailableInOss
        feature="Users"
        description="Manage end users across channels and conversations. Available in Distri Cloud."
        icon={User}
      />
    </div>
  );
}
