import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-border rounded-xl shadow-sm p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Seu perfil atual não tem permissão para abrir esta área do ERP.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Link to="/" className="px-4 py-2 text-sm rounded border border-border hover:bg-muted">
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
