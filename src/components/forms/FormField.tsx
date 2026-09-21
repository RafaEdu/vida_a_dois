import type { ReactNode } from "react";
import {
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { formStyles } from "../../styles/forms";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
}

export function FormField({
  label,
  children,
  error,
  containerStyle,
  labelStyle,
  errorStyle,
}: FormFieldProps) {
  return (
    <View style={[formStyles.field, containerStyle]}>
      <Text style={[formStyles.label, labelStyle]}>{label}</Text>
      {children}
      {error ? (
        <Text style={[formStyles.fieldError, errorStyle]} selectable>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
