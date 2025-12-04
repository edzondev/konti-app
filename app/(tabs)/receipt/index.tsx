import { View, Text, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { COLORS } from '@/constants/colors';
import { useReceipts } from '@/hooks/receipts/use-receipts';
import { useDebounce } from '@/hooks/use-debounce';
import useFilterReceipt from '@/hooks/receipts/use-filter-receipt';
import Empty from '@/components/shared/empty/empty';
import ReceiptListItem from '@/components/shared/receipt/receipt-list-item';
import { SearchBar } from '@/components/shared/receipt/search-bar';
import { FilterPills } from '@/components/shared/receipt/filter-pills';
import MainLayout from '@/components/layouts/main-layout';

export default function Recipes() {
  const {
    filters,
    searchText,
    handleFilterChange,
    toggleSortOrder,
    getCurrentFilterType,
    handleSearchChange,
    clearSearch,
  } = useFilterReceipt();

  const debouncedFilters = useDebounce(filters, 300);
  const { data, isLoading, refetch } = useReceipts(debouncedFilters);

  return (
    <MainLayout edges={['top', 'bottom']}>
      <View className="flex-1 px-4">
        <View className="mb-6 mt-8">
          <Text
            className="text-3xl font-bold text-neutral-foreground"
            numberOfLines={1}
          >
            Boletas y Facturas
          </Text>
        </View>

        <SearchBar
          value={searchText}
          onChangeText={handleSearchChange}
          onClear={clearSearch}
        />

        <FilterPills
          currentFilter={getCurrentFilterType()}
          sortBy={filters.sortBy ?? 'date_desc'}
          onFilterChange={handleFilterChange}
          onToggleSortOrder={toggleSortOrder}
        />

        {!isLoading && data && data.length > 0 && (
          <View className="my-4">
            <Text
              className="text-sm font-normal text-neutral-muted"
              numberOfLines={1}
            >
              {data.length}{' '}
              {data.length === 1 ? 'valor encontrado' : 'valores encontrados'}
            </Text>
          </View>
        )}

        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={COLORS.primary.default} />
            </View>
          ) : !data || data.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Empty />
            </View>
          ) : (
            <FlashList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ReceiptListItem receipt={item} />}
              onRefresh={refetch}
              refreshing={isLoading}
              ItemSeparatorComponent={() => <View className="h-4" />}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </MainLayout>
  );
}
