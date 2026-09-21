import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { C } from "../../theme/colors";
import { formStyles } from "../../styles/forms";

interface FormErrorProps {
  message?: string | null;
  variant?: "box" | "plain";
}

export function FormError({ message, variant = "box" }: FormErrorProps) {
  if (!message) return null;

  if (variant === "plain") {
    return (
      <View style={formStyles.plainErrorBox}>
        <Text style={formStyles.plainErrorText} selectable>
          {message}
        </Text>
      </View>
    );
  }

  return (
    <View style={formStyles.errorBox}>
      <MaterialIcons name="error-outline" size={18} color={C.error} />
      <Text style={formStyles.errorText} selectable>
        {message}
      </Text>
    </View>
  );
}
