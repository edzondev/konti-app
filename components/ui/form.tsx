import React from 'react';
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Text, View, type TextProps, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

type FormItemProps = ViewProps & {};

type FormLabelProps = TextProps & {};

type FormControlProps = ViewProps & {};

type FormDescriptionProps = TextProps & {};

type FormMessageProps = TextProps & {};

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

type FormItemContextValue = {
  id: string;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

const FormItem = ({ className, ...props }: FormItemProps) => {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <View
        data-slot="form-item"
        className={cn('gap-y-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
};

const FormLabel = ({ className, children, ...props }: FormLabelProps) => {
  const { error, formItemId } = useFormField();
  return (
    <Label
      id={formItemId}
      data-slot="form-label"
      data-error={!!error}
      className={cn('data-[error=true]:text-red-500', className)}
      {...props}
    >
      {children}
    </Label>
  );
};

const FormControl = ({ className, ...props }: FormControlProps) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <View
      id={formItemId}
      data-slot="form-control"
      className={cn('gap-y-2', className)}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
};

const FormDescription = ({
  className,
  children,
  ...props
}: FormDescriptionProps) => {
  const { formDescriptionId } = useFormField();

  return (
    <Text
      id={formDescriptionId}
      data-slot="form-description"
      className={cn('text-mutedForeground text-sm', className)}
      {...props}
    >
      {children}
    </Text>
  );
};

const FormMessage = ({ className, children, ...props }: FormMessageProps) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? '') : children;

  if (!body) {
    return null;
  }
  return (
    <Text
      id={formMessageId}
      data-slot="form-message"
      className={cn('text-base text-red-500', className)}
      {...props}
    >
      {body}
    </Text>
  );
};

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
