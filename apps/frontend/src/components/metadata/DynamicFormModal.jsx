import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
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
          const baseNumber = z.preprocess(
            (val) => {
              if (val === '' || val === null || val === undefined) return undefined;
              const n = typeof val === 'number' ? val : Number(val);
              return Number.isFinite(n) ? n : undefined;
            },
            z.number({ invalid_type_error: 'Número inválido' })
          );
          fieldSchema = field.required
            ? baseNumber.refine((val) => val !== undefined, { message: `Campo ${field.label} é obrigatório` })
            : baseNumber.optional();
          if (field.validation_rules?.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation_rules.min, `Mínimo: ${field.validation_rules.min}`);
          }
          if (field.validation_rules?.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation_rules.max, `Máximo: ${field.validation_rules.max}`);
          }
        } else if (field.data_type === 'text' || field.data_type === 'textarea') {
          const baseText = z.preprocess(
            (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
            z.string()
          );
          fieldSchema = field.required
            ? baseText.refine((val) => typeof val === 'string' && val.length > 0, { message: `Campo ${field.label} é obrigatório` })
            : baseText.optional();
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
          const baseEmail = z.preprocess(
            (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
            z.string().email('Email inválido')
          );
          fieldSchema = field.required
            ? baseEmail.refine((val) => typeof val === 'string' && val.length > 0, { message: `Campo ${field.label} é obrigatório` })
            : baseEmail.optional();
        } else if (field.data_type === 'date') {
          const baseDate = z.preprocess(
            (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
            z.union([z.string(), z.undefined()])
          );
          const isoDay = /^\d{4}-\d{2}-\d{2}$/;
          fieldSchema = field.required
            ? baseDate.refine((val) => typeof val === 'string' && isoDay.test(val), {
                message: `Campo ${field.label}: informe a data (AAAA-MM-DD)`,
              })
            : baseDate.refine(
                (val) => val === undefined || (typeof val === 'string' && isoDay.test(val)),
                { message: `Campo ${field.label}: data inválida` }
              );
        } else if (field.data_type === 'boolean') {
          fieldSchema = z.preprocess(
            (v) => {
              if (v === '' || v === undefined || v === null) return field.required ? false : undefined;
              return v === true || v === 'true' || v === 1 || v === '1';
            },
            field.required ? z.boolean() : z.boolean().optional()
          );
        } else if (field.data_type === 'reference') {
          const baseRef = z.preprocess(
            (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
            z.string()
          );
          fieldSchema = field.required
            ? baseRef.refine((val) => typeof val === 'string' && val.length > 0, {
                message: `Campo ${field.label} é obrigatório`,
              })
            : baseRef.optional();
        } else if (field.data_type === 'multiselect') {
          fieldSchema = z.preprocess(
            (v) => {
              if (v === '' || v === undefined || v === null) return [];
              return Array.isArray(v) ? v.map(String) : [];
            },
            field.required
              ? z.array(z.string()).min(1, { message: `Selecione ao menos uma opção em ${field.label}` })
              : z.array(z.string()).optional()
          );
        } else if (field.data_type === 'select' && field.data_type_params?.options?.length) {
          const options = field.data_type_params.options;
          const baseSelect = z.preprocess(
            (val) => (val === '' || val === null || val === undefined ? undefined : val),
            z.enum(options, { message: 'Opção inválida' })
          );
          fieldSchema = field.required
            ? baseSelect.refine((val) => val !== undefined, { message: `Campo ${field.label} é obrigatório` })
            : baseSelect.optional();
        } else if (field.data_type === 'select') {
          const baseStr = z.preprocess(
            (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
            z.string()
          );
          fieldSchema = field.required
            ? baseStr.refine((val) => typeof val === 'string' && val.length > 0, {
                message: `Campo ${field.label} é obrigatório`,
              })
            : baseStr.optional();
        } else if (field.data_type === 'json') {
          fieldSchema = field.required
            ? z.any().refine(
                (v) => {
                  if (v === '' || v === null || v === undefined) return false;
                  if (typeof v === 'string') {
                    try {
                      JSON.parse(v);
                      return true;
                    } catch {
                      return false;
                    }
                  }
                  return typeof v === 'object';
                },
                { message: `Campo «${field.label}» deve ser um JSON válido (objeto ou lista).` }
              )
            : z
                .any()
                .optional()
                .refine(
                  (v) =>
                    v === '' ||
                    v === undefined ||
                    v === null ||
                    typeof v === 'object' ||
                    (typeof v === 'string' &&
                      (() => {
                        try {
                          JSON.parse(v);
                          return true;
                        } catch {
                          return false;
                        }
                      })()),
                  { message: `Campo «${field.label}» deve ser um JSON válido.` }
                );
        }

        schemaObj[field.code] = fieldSchema;
      }
    }

    return z.object(schemaObj);
  };

  const form = useForm({
    resolver: zodResolver(generateSchema()),
    defaultValues: record?.data || record || {}
  });

  const onSubmit = async (values) => {
    try {
      setSaving(true);

      const normalized = { ...values };
      for (const field of entity?.fields || []) {
        if (field.hidden || field.data_type !== 'json') continue;
        const code = field.code;
        let v = normalized[code];

        if (v === '' || v === undefined) {
          normalized[code] = null;
          continue;
        }

        if (typeof v === 'string') {
          try {
            v = JSON.parse(v);
          } catch {
            toast.error(`Campo «${field.label || code}»: JSON inválido.`);
            return;
          }
        }

        normalized[code] = v;

        const valid =
          v !== null &&
          (typeof v === 'object' || Array.isArray(v));
        if (!valid && field.required) {
          toast.error(`Campo «${field.label || code}» obrigatório: use objeto ou lista JSON válidos.`);
          return;
        }
      }

      const payload = {
        entity: entityCode,
        data: normalized,
      };

      if (record) {
        const res = await apiPut(`/api/records/${record.id}`, { data: normalized });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await apiPost('/api/records', payload);
        if (!res.success) throw new Error(res.error);
      }

      toast.success(record ? 'Registro atualizado' : 'Registro criado');
      onOpenChange(false);

      if (onSuccess) {
        onSuccess(record ? { ...record, ...normalized } : { id: Date.now(), ...normalized });
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
      <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Editar' : 'Novo'} {entity.name}
          </DialogTitle>
          <DialogDescription>
            {record ? 'Altere os dados' : 'Preencha os campos'}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&_input]:w-full [&_select]:w-full [&_textarea]:w-full">
              {entity.fields
                ?.filter((field) => !field.readonly || record)
                .map((field) => (
                  <DynamicField
                    key={field.id}
                    fieldConfig={field}
                    disabled={field.readonly && !record}
                  />
                ))}
            </div>

            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
