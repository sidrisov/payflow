import { Button, Divider, Stack, Typography } from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { ContactType } from '@payflow/common';
import { useNavigate } from 'react-router';
import { SearchIdentityListItem } from './SearchIdentityListItem';
import {
  SelectIdentityCallbackType,
  UpdateIdentityCallbackType
} from './dialogs/SearchIdentityDialog';
import { useContext, useState } from 'react';
import calculateMaxPages from '../utils/pagination';
import { ProfileContext } from '../contexts/UserContext';

const pageSize = 30;

interface SearchResultViewProps
  extends CloseCallbackType,
    SelectIdentityCallbackType,
    UpdateIdentityCallbackType {
  profileRedirect?: boolean;
  showExtra?: boolean;
  identities: ContactType[];
}

interface SearchResultProfileListViewProps {
  showContactsNumber?: boolean;
  showHorizantally?: boolean;
  title: string;
  identities: ContactType[];
  profileRedirect?: boolean;
  selectIdentityCallback?: SelectIdentityCallbackType['selectIdentityCallback'];
  updateIdentityCallback?: UpdateIdentityCallbackType['updateIdentityCallback'];
  closeStateCallback: CloseCallbackType['closeStateCallback'];
}

const formatFlowType = (type: string) => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())[0];
};

export function SearchResultView({
  profileRedirect,
  showExtra,
  closeStateCallback,
  selectIdentityCallback,
  updateIdentityCallback,
  identities
}: SearchResultViewProps) {
  const navigate = useNavigate();
  const { profile } = useContext(ProfileContext);

  function SearchResultProfileListView({
    showContactsNumber = true,
    showHorizantally = false,
    title,
    identities,
    profileRedirect,
    selectIdentityCallback,
    updateIdentityCallback,
    closeStateCallback
  }: SearchResultProfileListViewProps) {
    // Merge profiles and addresses inside this function
    const mergedIdentities = [
      ...identities
        .filter((identity) => identity.data.profile)
        .map((identity) => ({ identity, view: 'profile' })),
      ...identities
        .filter((identity) => identity.data.meta)
        .map((identity) => ({ identity, view: 'address' }))
    ] as { identity: ContactType; view: 'address' | 'profile' }[];

    const maxPages = calculateMaxPages(mergedIdentities.length, pageSize);
    const [page, setPage] = useState<number>(1);

    const onIdentityClick = (contact: ContactType, view: 'address' | 'profile') => {
      if (profileRedirect) {
        navigate(`/${contact.data.profile?.username ?? contact.data.address}`);
      } else if (selectIdentityCallback) {
        selectIdentityCallback({
          type: view,
          identity: contact.data
        });
      }
      closeStateCallback();
    };

    return (
      <>
        {mergedIdentities.length > 0 && (
          <>
            <Typography
              ml={1}
              variant="caption"
              fontWeight={500}
              color="text.secondary"
              textTransform="uppercase">
              {title}
              {showContactsNumber && ` (${mergedIdentities.length})`}
            </Typography>
            <Stack
              mb={1}
              direction={showHorizantally ? 'row' : 'column'}
              alignItems="center"
              justifyContent="flex-start"
              sx={{
                ...(showHorizantally && {
                  overflowX: 'scroll'
                })
              }}>
              {mergedIdentities.slice(0, page * pageSize).map(({ identity, view }) => (
                <SearchIdentityListItem
                  key={view === 'profile' ? identity.data.profile?.username : identity.data.address}
                  minimized={showHorizantally}
                  view={view}
                  contact={identity}
                  updateIdentityCallback={updateIdentityCallback}
                  {...((profileRedirect || selectIdentityCallback) && {
                    onClick: () => onIdentityClick(identity, view)
                  })}
                />
              ))}
              {page < maxPages && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setPage(page + 1);
                  }}
                  sx={{
                    p: 0.5,
                    textTransform: 'none',
                    borderRadius: 5
                  }}>
                  <Typography variant="subtitle2">Load more contacts</Typography>
                </Button>
              )}
            </Stack>
          </>
        )}
      </>
    );
  }

  const recent = showExtra
    ? identities.filter((identity) => identity.tags?.includes('recent'))
    : [];

  const myWallets = showExtra
    ? (profile?.flows
        ?.filter((flow) => !flow.archived)
        ?.map((flow) => ({
          data: {
            address: profile?.identity,
            profile: {
              ...profile,
              username:
                !flow.type || flow.type === 'REGULAR' || flow.type === 'JAR'
                  ? flow.title
                  : formatFlowType(flow.type),
              defaultFlow: flow
            }
          },
          tags: ['wallets']
        })) ?? [])
    : [];

  const popular = showExtra
    ? identities.filter((identity) => identity.tags?.includes('popular'))
    : [];

  return (
    <>
      {showExtra && (
        <>
          <SearchResultProfileListView
            showHorizantally={true}
            showContactsNumber={false}
            title="Recent"
            identities={recent}
            profileRedirect={profileRedirect}
            selectIdentityCallback={selectIdentityCallback}
            updateIdentityCallback={updateIdentityCallback}
            closeStateCallback={closeStateCallback}
          />
          <SearchResultProfileListView
            showContactsNumber={false}
            title="My wallets"
            identities={myWallets}
            selectIdentityCallback={selectIdentityCallback}
            updateIdentityCallback={updateIdentityCallback}
            closeStateCallback={closeStateCallback}
          />
          <SearchResultProfileListView
            showContactsNumber={false}
            title="Popular"
            identities={popular}
            profileRedirect={profileRedirect}
            selectIdentityCallback={selectIdentityCallback}
            updateIdentityCallback={updateIdentityCallback}
            closeStateCallback={closeStateCallback}
          />

          {(myWallets.length > 0 || recent.length > 0 || popular.length > 0) && (
            <Divider flexItem variant="middle" sx={{ mb: 1.5 }} />
          )}
        </>
      )}

      <SearchResultProfileListView
        title="Total"
        identities={identities}
        profileRedirect={profileRedirect}
        selectIdentityCallback={selectIdentityCallback}
        updateIdentityCallback={updateIdentityCallback}
        closeStateCallback={closeStateCallback}
      />
    </>
  );
}
