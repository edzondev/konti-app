import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge, SafeAreaViewProps } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type MainLayoutProps = PropsWithChildren<
  SafeAreaViewProps & {
    edges?: Edge[];
  }
>;

export default function MainLayout({
  children,
  edges,
  className,
  ...props
}: MainLayoutProps) {
  return (
    <SafeAreaView
      className={cn('flex-1 bg-white  ', className)}
      edges={edges}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
