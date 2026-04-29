import * as React from "react"
import { cn } from "@/lib/utils"

const Form = React.forwardRef(({ className, ...props }, ref) => (
  <form ref={ref} className={cn("space-y-4", className)} {...props} />
))
Form.displayName = "Form"

const FormField = React.forwardRef(({ name, render, ...props }, ref) => {
  // Wrapper simples, integra com react-hook-form
  const { field } = useFormContext();
  const fieldState = field?.state?.fieldErrors?.[name];
  
  return (
    <div className="space-y-1">
      {render({ field: { ...field, name }, fieldState })}
      {fieldState && (
        <p className="text-[11px] text-destructive">{String(fieldState.message)}</p>
      )}
    </div>
  );
});
FormField.displayName = "FormField";

const FormItem = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-1", className)} {...props} />
))
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
))
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
FormControl.displayName = "FormControl"

const FormMessage = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[11px] text-destructive", className)}
    {...props}
  />
))
FormMessage.displayName = "FormMessage"

const FormDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[11px] text-muted-foreground", className)}
    {...props}
  />
))
FormDescription.displayName = "FormDescription"

export { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription }
