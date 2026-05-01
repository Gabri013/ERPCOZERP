import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { useMetadataStore } from '@/stores/metadataStore';
import { api } from '@/services/api';
import {
  Input,
  Textarea,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
} from '@/components/ui';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function JsonFormField({ value, onChange, disabled }) {
  const [txt, setTxt] = useState('');

  useEffect(() => {
    if (value === undefined || value === null) setTxt('');
    else if (typeof value === 'object') setTxt(JSON.stringify(value, null, 2));
    else setTxt(String(value));
  }, [value]);

  return (
    <Textarea
      rows={10}
      className="font-mono text-xs"
      value={txt}
      onChange={(e) => setTxt(e.target.value)}
      onBlur={() => {
        const raw = txt.trim();
        if (!raw) {
          onChange(null);
          return;
        }
        try {
          onChange(JSON.parse(raw));
        } catch {
          toast.error('JSON inválido — ajuste o conteúdo antes de salvar.');
        }
      }}
      disabled={disabled}
    />
  );
}

export default function DynamicField({
  fieldConfig,
  disabled = false
}) {
  const { entities } = useMetadataStore();
  const [referenceOptions, setReferenceOptions] = useState([]);
  const [searchRef, setSearchRef] = useState('');

  const {
    label,
    code,
    data_type,
    data_type_params,
    required,
    readonly,
    hidden,
  } = fieldConfig;

  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const value = watch(code);

  // Se for reference, carrega opções da entidade referenciada
  useEffect(() => {
    if (data_type !== 'reference' || !data_type_params?.reference) return undefined;

    const refCode = data_type_params.reference;
    const refEntity = entities.find((e) => e.code === refCode);
    if (!refEntity) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const json = await api.get(`/api/records?entity=${encodeURIComponent(refCode)}`, { silent403: true });
        const payload = json?.data;
        if (cancelled || !payload?.success) return;
        const refField =
          refEntity.fields.find((f) => f.data_type === 'text' || f.data_type === 'select')?.code || 'codigo';
        const rows = Array.isArray(payload.data) ? payload.data : [];
        setReferenceOptions(
          rows.map((item) => ({
            id: item.id,
            label: item.data?.[refField] ?? item.id,
            ...item,
          })),
        );
      } catch {
        if (!cancelled) setReferenceOptions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data_type, data_type_params, entities]);

  // Se o valor mudar, repassa para o formulário
  const handleChange = (val) => {
    setValue(code, val);
  };

  const renderInput = () => {
    switch (data_type) {
      case 'text':
      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <Input
            type={data_type === 'number' || data_type === 'currency' || data_type === 'percentage' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={label}
            disabled={disabled || readonly}
            step={data_type === 'currency' || data_type === 'percentage' ? '0.01' : undefined}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={label}
            disabled={disabled || readonly}
            rows={3}
          />
        );

      case 'boolean':
        return (
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => handleChange(checked)}
            disabled={disabled || readonly}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !value && 'text-muted-foreground'
                  )}
                  disabled={disabled || readonly}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione data</span>}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleChange(date ? date.toISOString().split('T')[0] : '')}
              />
            </PopoverContent>
          </Popover>
        );

      case 'select':
        return (
          <Select 
            value={value || ''} 
            onValueChange={(val) => handleChange(val)}
            disabled={disabled || readonly}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {data_type_params?.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect': {
        const opts = data_type_params?.options || [];
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-col gap-2 border rounded-md p-3">
            {opts.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={(checked) => {
                    if (checked) handleChange([...selected, opt]);
                    else handleChange(selected.filter((x) => x !== opt));
                  }}
                  disabled={disabled || readonly}
                />
                {opt}
              </label>
            ))}
          </div>
        );
      }

      case 'json':
        return <JsonFormField value={value} onChange={handleChange} disabled={disabled || readonly} />;

      case 'reference':
        return (
          <div>
            <Select 
              value={value || ''} 
              onValueChange={(val) => handleChange(val)}
              disabled={disabled || readonly}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Selecione ${label}`}>
                  {value && (
                    (() => {
                      const selected = referenceOptions.find(o => o.id === value);
                      return selected ? selected.label : value;
                    })()
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {referenceOptions
                  .filter(opt => opt.label.toLowerCase().includes(searchRef.toLowerCase()))
                  .map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            {referenceOptions.length > 5 && (
              <div className="mt-2 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchRef}
                  onChange={(e) => setSearchRef(e.target.value)}
                  className="pl-8 w-full text-sm border rounded px-2 py-1"
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input value={value || ''} onChange={(e) => handleChange(e.target.value)} disabled />
        );
    }
  };

  const error = errors[code] && errors[code].message;

  return (
    <FormField
      name={code}
      render={({ field: dummyField }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium flex items-center gap-1">
            {label}
            {required && <span className="text-destructive">*</span>}
          </FormLabel>
          <FormControl>
            {renderInput()}
          </FormControl>
          {error && <FormMessage>{String(error)}</FormMessage>}
        </FormItem>
      )}
    />
  );
}
