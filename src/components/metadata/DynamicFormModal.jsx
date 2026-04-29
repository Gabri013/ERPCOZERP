import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMetadataStore } from '@/stores/metadataStore';
import { useDataStore } from '@/stores/dataStore';
import { toast } from 'sonner';
import DynamicField from './DynamicField';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { apiPost, apiPut } from '@/utils/api';

export default function DynamicFormModal({
  entityCode,
  entity,
  record = null,
  open,
  onOpenChange,
  onSuccess
}) {
  const { loadEntities } = useMetadataStore();
  const { clearEntityCache } = useDataStore();
  const [saving, setSaving] = useState(false);

  const generateSchema = () => {
    const schemaObj = {};

    if (entity?.fields) {
      for (const field of entity.fields) {
        if (field.hidden) continue;

        let fieldSchema = z.any();

        if (field.data_type === 'number' || field.data_type === 'currency' || field.data_type === 'percentage') {
          fieldSchema = z.number();
          if (field.required) {
            fieldSchema = fieldSchema.refine((val) => val !== undefined && val !== null, {
              message: `Campo ${field.label} é obrigatório`
            });
          }
          if (field.validation_rules?.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation_rules.min, `Mínimo: ${field.validation_rules.min}`);
          }
          if (field.validation_rules?.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation_rules.max, `Máximo: ${field.validation_rules.max}`);
          }
        } else if (field.data_type === 'text' || field.data_type === 'textarea') {
          fieldSchema = z.string();
          if (field.required) {
            fieldSchema = fieldSchema.min(1, `Campo ${field.label} é obrigatório`);
          }
          if (field.validation_rules?.minLength) {
            fieldSchema = fieldSchema.min(field.validation_rules.minLength);
          }
          if (field.validation_rules?.maxLength) {
            fieldSchema = fieldSchema.max(field.validation_rules.maxLength);
          }
          if (field.validation_rules?.pattern) {
            const regex = new RegExp(field.validation_rules.pattern);
            fieldSchema = fieldSchema.regex(regex, 'Formato inválido');
          }
        } else if (field.data_type === 'email') {
          fieldSchema = z.string().email('Email inválido');
        } else if (field.data_type === 'select' && field.data_type_params?.options) {
          fieldSchema = z.enum(field.data_type_params.options);
        }

        schemaObj[field.code] = fieldSchema;
      }
    }

    return z.object(schemaObj);
  };

  const form = useForm({
    resolver: zodResolver(generateSchema()),
    defaultValues: record || {}
  });

  const onSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        entity_id: entity.id,
        data: values
      };

      if (record) {
        const res = await apiPut(`/api/records/${record.id}`, payload);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await apiPost('/api/records', payload);
        if (!res.success) throw new Error(res.error);
      }

      toast.success(record ? 'Registro atualizado' : 'Registro criado');
      onOpenChange(false);

      if (onSuccess) {
        onSuccess(record ? { ...record, ...values } : { id: Date.now(), ...values });
      } else {
        clearEntityCache(entityCode);
        loadEntities();
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Editar' : 'Novo'} {entity.name}
          </DialogTitle>
          <DialogDescription>
            {record ? 'Altere os dados' : 'Preencha os campos'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {entity.fields
            ?.filter((field) => !field.readonly || record)
            .map((field) => (
              <DynamicField
                key={field.id}
                fieldConfig={field}
                value={record?.data?.[field.code] || record?.[field.code] || ''}
                onChange={(code, val) => form.setValue(code, val)}
                error={form.formState.errors[field.code]}
                disabled={field.readonly && !record}
              />
            ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
