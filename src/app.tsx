import React, { useMemo, useState } from 'react';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
  from,
  HttpLink,
  useApolloClient
} from '@apollo/client';

import { concatMap, from as fromRx, switchMap } from 'rxjs'
import styles from './index.scss';

import { ApolloQueryResult } from '@apollo/client/core/types';
import { useParallelRequests } from './use-parallel-request';

export type IProps = {
  enable?: boolean;
};


function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

const customFetch = async (uri: string, options: any) => {
  
  const result = await fetch(uri, options)
  await sleep(1000)

  return result;
};

const client = new ApolloClient({
  link: from([
    // new ParallelLink(),
    new HttpLink({ uri: "https://countries.trevorblades.com", fetch: customFetch })
  ]),
  cache: new InMemoryCache()
});



interface CountryProps {
  code: string
  onClose: () => void
}

const COUNTRY_INFO = gql`
      query Country ($code: ID!) {
        country (code: $code) {
          name
          capital
          code
        }
      }
    `

const COUNTRY_CURRENCY = gql`
  query CountryCurrency ($code: ID!) {
        country (code: $code) {
          currency
          code
        }
      }
`

function useCountry(code: string) {
  const client = useApolloClient()
  
  const result = useParallelRequests(useMemo(() => () => {
    return fromRx(client.watchQuery<{ code: string }>({
        query: COUNTRY_CURRENCY,
        variables: { code },
      })
    ).pipe(
      concatMap(currencyInfo => client.watchQuery({
        query: COUNTRY_INFO,
        // @ts-ignore
        variables: { code: currencyInfo.data.country.code },
      }))
    )
  }, [code, client]))
  
  console.log(result)
  
  return result ?? { data: undefined, loading: true, error: undefined }
}

function Country(props: CountryProps) {
  
  // const { loading, error, data } = useQuery(COUNTRY_INFO, {
  //   variables: { code: props.code }
  // });
  
  const { loading, data, error } = useCountry(props.code) as ApolloQueryResult<any>
  
  if (loading || error) {
    return (<button onClick={props.onClose}>Nothing</button>);
  }
  
  return (
    <section>
      <h2>{data.country.name}</h2>
      <button onClick={props.onClose}> {data.country.capital}</button>
    </section>
  );
}

function App () {
  // const [countries, setCountries] = useState(['RU', 'US', 'GB', 'SL', 'AU', 'AS'])
  const [countries, setCountries] = useState(['RU', 'US', 'GB', 'SL', 'AU', 'AS', 'FR', 'AD', 'AE', 'AF'])
  
  return (
    <ApolloProvider client={client}>
      <div className={styles.element}>
        <button onClick={() => setCountries(['AS'])}>Close</button>
  
        {
          countries.map((code) =>
            <Country
              key={code}
              code={code}
              onClose={() => setCountries(countries => countries.filter(id => code !== id ))}/>)
        }
      </div>
    </ApolloProvider>
  );
}

export default App;
