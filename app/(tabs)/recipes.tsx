import {
  ArrowUpDown,
  ChevronLeft,
  Filter,
  ReceiptText,
  Search,
  TrendingUp,
} from "@/constants/icons";
import {
  View,
  Pressable,
  TextInput,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { cn } from "@/lib/utils";
import { useReceipts } from "@/hooks/receipts/use-receipts";
import { FlashList } from "@shopify/flash-list";
import { dateFormat } from "@/lib/date-format";
import Empty from "@/components/shared/empty/empty";
import { useDebounce } from "@/hooks/use-debounce";
import useFilterReceipt from "@/hooks/receipts/use-filter-receipt";
import { useState } from "react";

export default function Recipes() {
  const [searchText, setSearchText] = useState("");
  const {
    filters,
    handleFilterChange,
    toggleSortOrder,
    getCurrentFilterType,
    handleSearchChange,
  } = useFilterReceipt();
  const debouncedFilters = useDebounce(filters, 300);
  const { data, isLoading, refetch } = useReceipts(debouncedFilters);

  return (
    <SafeAreaView className="flex-1 bg-white py-4">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="mb-4 bg-white">
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => {}}
              className="hover:bg-muted -ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              aria-label="Volver"
            >
              <ChevronLeft color={COLORS.neutral.foreground} size={24} />
            </Pressable>
            <Text className="text-lg font-light text-neutral-foreground">
              Todas las boletas
            </Text>
          </View>
        </View>

        {/* Barra de búsqueda */}
        <View className="relative mb-4">
          <View
            className="absolute left-4 top-1/2 z-10"
            style={{ transform: [{ translateY: -12 }] }}
          >
            <Search color={COLORS.muted.foreground} size={20} />
          </View>
          <TextInput
            keyboardType="default"
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              handleSearchChange(text);
            }}
            placeholder="Buscar por empresa, RUC, monto..."
            className="bg-muted/30 h-14 w-full rounded-xl border border-neutral-border py-3 pl-12 pr-4 text-sm font-light outline-none"
            placeholderTextColor={COLORS.muted.foreground}
          />
        </View>

        {/* Pills de filtros */}
        <View className="mt-2">
          <ScrollView
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
            keyboardShouldPersistTaps="handled"
            horizontal
          >
            <Pressable
              onPress={() => handleFilterChange("all")}
              className={cn(
                "flex-row items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-light",
                getCurrentFilterType() === "all"
                  ? "bg-primary"
                  : "bg-neutral-border",
              )}
            >
              <Filter
                size={16}
                color={
                  getCurrentFilterType() === "all"
                    ? COLORS.neutral.white
                    : COLORS.neutral.foreground
                }
              />
              <Text
                className={
                  getCurrentFilterType() === "all"
                    ? "text-white"
                    : "text-neutral-foreground"
                }
              >
                Todas
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleFilterChange("expense")}
              className={cn(
                "flex-row items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-light transition-all",
                getCurrentFilterType() === "expense"
                  ? "bg-emerald-500"
                  : "bg-emerald-500/10",
              )}
            >
              <TrendingUp
                size={16}
                color={
                  getCurrentFilterType() === "expense" ? "#fff" : "#047857"
                }
              />
              <Text
                className={
                  getCurrentFilterType() === "expense"
                    ? "text-white"
                    : "text-emerald-700"
                }
              >
                Contables
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleFilterChange("nonExpense")}
              className={cn(
                "flex-row items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-light transition-all",
                getCurrentFilterType() === "nonExpense"
                  ? "bg-indigo-500"
                  : "bg-indigo-500/10",
              )}
            >
              <ReceiptText
                size={16}
                color={
                  getCurrentFilterType() === "nonExpense" ? "#fff" : "#6366f1"
                }
              />
              <Text
                className={
                  getCurrentFilterType() === "nonExpense"
                    ? "text-white"
                    : "text-indigo-700"
                }
              >
                No contables
              </Text>
            </Pressable>
            <Pressable
              onPress={toggleSortOrder}
              className="flex-row items-center gap-2 whitespace-nowrap rounded-full bg-violet-500/10 px-4 py-2 text-sm font-light transition-all hover:bg-violet-500/20"
            >
              <ArrowUpDown size={16} color="#9333EA" />
              <Text className="text-violet-700">
                {filters.sortBy === "date_desc"
                  ? "Más recientes"
                  : "Más antiguos"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Contador de resultados */}
        <View className="my-4">
          <Text className="text-sm font-light text-muted-foreground">
            {data?.length ?? 0}{" "}
            {(data?.length ?? 0) === 1
              ? "boleta encontrada"
              : "boletas encontradas"}
          </Text>
        </View>

        {/* Lista de boletas */}
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlashList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="flex-row items-center gap-4 rounded-2xl border border-neutral-border bg-white p-4">
                  <View className="min-w-0 flex-1">
                    <Text className="mb-0.5 truncate text-sm font-normal text-neutral-foreground">
                      {item.business_name ||
                        item.receipt_number ||
                        "Comprobante"}
                    </Text>
                    <Text className="text-xs font-light text-muted-foreground">
                      {dateFormat(item.created_at ?? "")}
                    </Text>
                  </View>
                  <View className="flex flex-col items-end gap-1">
                    <Text className="text-base font-normal text-neutral-foreground">
                      S/ {item.total_amount?.toFixed(2)}
                    </Text>
                    {item.is_expense && (
                      <Text className="rounded bg-primary/10 px-2 py-0.5 text-xs font-light text-primary">
                        Contable
                      </Text>
                    )}
                  </View>
                </View>
              )}
              onRefresh={refetch}
              refreshing={isLoading}
              ItemSeparatorComponent={() => <View className="h-4" />}
              ListEmptyComponent={() => <Empty />}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
