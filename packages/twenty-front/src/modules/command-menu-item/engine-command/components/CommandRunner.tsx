import { CommandMenuItemErrorBoundary } from '@/command-menu-item/display/components/CommandMenuItemErrorBoundary';
import { getEngineComponentKeyComponentMap } from '@/command-menu-item/engine-command/constants/EngineComponentKeyHeadlessComponentMap';
import { useUnmountCommand } from '@/command-menu-item/engine-command/hooks/useUnmountEngineCommand';
import { CommandComponentInstanceContext } from '@/command-menu-item/engine-command/states/contexts/CommandComponentInstanceContext';
import { headlessCommandContextApisState } from '@/command-menu-item/engine-command/states/headlessCommandContextApisState';
import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const CommandRunner = () => {
  const headlessCommandContextApis = useAtomStateValue(
    headlessCommandContextApisState,
  );
  const unmountCommand = useUnmountCommand();

  return (
    <>
      {[...headlessCommandContextApis.entries()].map(
        ([commandMenuItemId, context]) => (
          <ContextStoreComponentInstanceContext.Provider
            key={commandMenuItemId}
            value={{ instanceId: context.contextStoreInstanceId }}
          >
            <CommandComponentInstanceContext.Provider
              value={{ instanceId: commandMenuItemId }}
            >
              <CommandMenuItemErrorBoundary
                shouldReportToSentry
                onError={() => unmountCommand(commandMenuItemId)}
              >
                {getEngineComponentKeyComponentMap()[context.engineComponentKey]}
              </CommandMenuItemErrorBoundary>
            </CommandComponentInstanceContext.Provider>
          </ContextStoreComponentInstanceContext.Provider>
        ),
      )}
    </>
  );
};
