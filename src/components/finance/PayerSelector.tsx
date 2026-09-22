import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { getInitials } from "../../utils/initials";
import { payerSelectorStyles as styles } from "../../styles/payer-selector";

export interface PayerOption {
  id: string;
  full_name: string;
}

interface PayerSelectorProps {
  value: string;
  onChange: (id: string) => void;
  self: PayerOption;
  partner: PayerOption | null;
}

export function PayerSelector({
  value,
  onChange,
  self,
  partner,
}: PayerSelectorProps) {
  const selfLabel = self.full_name || "Você";

  return (
    <View style={styles.paidByRow} accessibilityRole="radiogroup">
      <Pressable
        style={[
          styles.paidByOption,
          value === self.id && styles.paidByOptionSelected,
        ]}
        onPress={() => onChange(self.id)}
        accessibilityRole="radio"
        accessibilityLabel={selfLabel}
        accessibilityState={{ selected: value === self.id }}
      >
        <View style={styles.paidByAvatar}>
          <Text style={styles.paidByAvatarText}>
            {getInitials(self.full_name, "EU")}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.paidByName,
              value === self.id && styles.paidByNameSelected,
            ]}
            numberOfLines={1}
          >
            {selfLabel}
          </Text>
        </View>
        {value === self.id && (
          <MaterialIcons name="check-circle" size={20} color={colors.primary} />
        )}
      </Pressable>

      {partner && (
        <Pressable
          style={[
            styles.paidByOption,
            value === partner.id && styles.paidByOptionSelected,
          ]}
          onPress={() => onChange(partner.id)}
          accessibilityRole="radio"
          accessibilityLabel={partner.full_name}
          accessibilityState={{ selected: value === partner.id }}
        >
          <View style={[styles.paidByAvatar, styles.paidByAvatarPartner]}>
            <Text
              style={[styles.paidByAvatarText, styles.paidByAvatarTextPartner]}
            >
              {getInitials(partner.full_name, "??")}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.paidByName,
                value === partner.id && styles.paidByNameSelected,
              ]}
              numberOfLines={1}
            >
              {partner.full_name}
            </Text>
          </View>
          {value === partner.id && (
            <MaterialIcons
              name="check-circle"
              size={20}
              color={colors.primary}
            />
          )}
        </Pressable>
      )}
    </View>
  );
}
