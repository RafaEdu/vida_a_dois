import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { DEFAULT_CATEGORIES } from "../../constants/categories";
import { C } from "../../theme/colors";
import { categoryPickerStyles as styles } from "../../styles/category-picker";

interface CategoryPickerProps {
  value: string;
  onChange: (name: string) => void;
  variant?: "dropdown" | "chips";
}

export function CategoryPicker({
  value,
  onChange,
  variant = "dropdown",
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);

  if (variant === "chips") {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {DEFAULT_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.name}
            style={[styles.chip, value === cat.name && styles.chipActive]}
            onPress={() => onChange(cat.name)}
          >
            <Text
              style={[
                styles.chipText,
                value === cat.name && styles.chipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <>
      <Pressable style={styles.selector} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.selectorText}>{value}</Text>
        <MaterialIcons
          name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={20}
          color={C.outline}
        />
      </Pressable>

      {open && (
        <View style={styles.categoryList}>
          <ScrollView style={styles.categoryScroll} nestedScrollEnabled>
            {DEFAULT_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.name}
                style={[
                  styles.categoryItem,
                  value === cat.name && styles.categoryItemSelected,
                ]}
                onPress={() => {
                  onChange(cat.name);
                  setOpen(false);
                }}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <View style={styles.categoryInfo}>
                  <Text
                    style={[
                      styles.categoryName,
                      value === cat.name && styles.categoryNameSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  <Text style={styles.categoryType}>{cat.type}</Text>
                </View>
                {value === cat.name && (
                  <MaterialIcons name="check" size={18} color={C.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
}
