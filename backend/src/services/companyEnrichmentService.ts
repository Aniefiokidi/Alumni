import https from 'https';

export interface CompanyEnrichmentResult {
  companyWebsite?: string;
  companyDomain?: string;
  companyLogoUrl?: string;
}

export interface CompanySuggestion {
  name: string;
  domain?: string;
  website?: string;
  logoUrl?: string;
}

const getJson = (urlString: string, timeoutMs = 3500): Promise<any> => {
  return new Promise((resolve, reject) => {
    const req = https.get(urlString, (res) => {
      let raw = '';

      res.on('data', (chunk) => {
        raw += chunk;
      });

      res.on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Company lookup failed: ${res.statusCode || 'unknown status'}`));
          return;
        }

        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error('Company lookup returned invalid JSON'));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Company lookup timed out'));
    });

    req.on('error', reject);
  });
};

const normalize = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, '');

const extractDomainFromUrl = (urlString?: string): string | null => {
  if (!urlString) {
    return null;
  }

  try {
    const url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

const getDomainFromClearbit = async (companyName: string): Promise<string | null> => {
  const encoded = encodeURIComponent(companyName);
  const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encoded}`;
  const suggestions = await getJson(url);

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return null;
  }

  const target = normalize(companyName);
  const ranked = suggestions
    .map((item: any) => {
      const name = String(item?.name || '');
      const domain = String(item?.domain || '');
      const scoreBase = normalize(name);
      const exact = scoreBase === target ? 3 : 0;
      const contains = scoreBase.includes(target) || target.includes(scoreBase) ? 1 : 0;
      return {
        domain,
        score: exact + contains + (domain ? 1 : 0)
      };
    })
    .sort((a: any, b: any) => b.score - a.score);

  return String(ranked[0]?.domain || '').trim() || null;
};

const getDomainFromDuckDuckGo = async (companyName: string): Promise<string | null> => {
  const query = encodeURIComponent(`${companyName} official website`);
  const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&no_redirect=1`;
  const result = await getJson(url);

  const fromAbstract = extractDomainFromUrl(result?.AbstractURL);
  if (fromAbstract) {
    return fromAbstract;
  }

  const topics = Array.isArray(result?.RelatedTopics) ? result.RelatedTopics : [];
  for (const topic of topics) {
    const firstUrl = extractDomainFromUrl(topic?.FirstURL);
    if (firstUrl) {
      return firstUrl;
    }
  }

  return null;
};

const buildLogoCandidates = (domain: string): string[] => {
  return [
    `https://logo.clearbit.com/${domain}`,
    `https://unavatar.io/${domain}`,
    `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
  ];
};

export const searchCompanySuggestions = async (companyName: string): Promise<CompanySuggestion[]> => {
  const cleanName = String(companyName || '').trim();
  if (!cleanName) {
    return [];
  }

  const suggestions: CompanySuggestion[] = [];

  try {
    const encoded = encodeURIComponent(cleanName);
    const clearbitUrl = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encoded}`;
    const clearbitSuggestions = await getJson(clearbitUrl);

    if (Array.isArray(clearbitSuggestions)) {
      clearbitSuggestions.slice(0, 8).forEach((item: any) => {
        const name = String(item?.name || '').trim();
        const domain = String(item?.domain || '').trim();
        if (!name) {
          return;
        }

        suggestions.push({
          name,
          domain: domain || undefined,
          website: domain ? `https://${domain}` : undefined,
          logoUrl: domain ? `https://logo.clearbit.com/${domain}` : undefined
        });
      });
    }
  } catch {
    // Continue with fallback provider below.
  }

  if (suggestions.length === 0) {
    try {
      const domain = await getDomainFromDuckDuckGo(cleanName);
      if (domain) {
        suggestions.push({
          name: cleanName,
          domain,
          website: `https://${domain}`,
          logoUrl: `https://logo.clearbit.com/${domain}`
        });
      }
    } catch {
      // No-op, return empty list.
    }
  }

  return suggestions;
};

export const enrichCompanyDetails = async (companyName: string): Promise<CompanyEnrichmentResult | null> => {
  const cleanName = String(companyName || '').trim();
  if (!cleanName) {
    return null;
  }

  try {
    let domain = await getDomainFromClearbit(cleanName);
    if (!domain) {
      domain = await getDomainFromDuckDuckGo(cleanName);
    }

    if (!domain) {
      return null;
    }

    const logos = buildLogoCandidates(domain);

    return {
      companyDomain: domain,
      companyWebsite: `https://${domain}`,
      companyLogoUrl: logos[0]
    };
  } catch {
    return null;
  }
};
