import { useMutation, useQuery } from '@tanstack/react-query';

export const useQueryBase = <TData, TError = unknown>(
  options: Parameters<typeof useQuery<TData, TError>>[0],
) => {
  const queryResult = useQuery(options);

  return {
    ...queryResult,
  };
};

export const useMutationBase = <TData, TError = unknown, TVariables = void>(
  options: Parameters<typeof useMutation<TData, TError, TVariables>>[0],
) => {
  const mutationResult = useMutation(options);

  return {
    ...mutationResult,
  };
};
