import type { ReactElement, ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, maxContentWidth, screenPadding } from "../../theme";

export interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. */
  scroll?: boolean;
  /** Apply horizontal screen margins. Defaults to true. */
  padded?: boolean;
  /** Respect safe area insets. Defaults to true. */
  safe?: boolean;
  /** Safe area edges to apply when `safe` is true. */
  edges?: Edge[];
  background?: string;
  /** Keep the content column readable on wide screens. Defaults to true. */
  constrainWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: "handled" | "always" | "never";
  refreshControl?: ReactElement<RefreshControlProps>;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  safe = true,
  edges = ["top", "left", "right"],
  background = colors.background,
  constrainWidth = true,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
  refreshControl,
}: ScreenProps) {
  const { width } = useWindowDimensions();
  const horizontal =
    width >= maxContentWidth ? screenPadding.regular : screenPadding.compact;

  const contentStyle: StyleProp<ViewStyle> = [
    padded ? { paddingHorizontal: horizontal } : null,
    constrainWidth && width > maxContentWidth
      ? { width: "100%", maxWidth: maxContentWidth, alignSelf: "center" }
      : null,
    contentContainerStyle,
  ];

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  if (!safe) {
    return (
      <View style={[styles.root, { backgroundColor: background }, style]}>
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: background }, style]}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
});
