import { describe, it, expect } from 'vitest';
import {
  parsePublicSuffixRules,
  getPublicSuffixLength,
  getFreeSubdomainProvider,
  sanitizeRenewCycle,
} from '../src/index.js';

describe('Public Suffix List domain classification', () => {
  const rules = parsePublicSuffixRules(`
// ===BEGIN ICANN DOMAINS===
com
uk
co.uk
*.ck
!www.ck
// ===END ICANN DOMAINS===
`);

  it('matches normal TLDs and multi-label registration suffixes', () => {
    expect(getPublicSuffixLength('example.com', rules)).toBe(1);
    expect(getPublicSuffixLength('example.co.uk', rules)).toBe(2);
  });

  it('implements wildcard and exception rules', () => {
    expect(getPublicSuffixLength('a.b.ck', rules)).toBe(2);
    expect(getPublicSuffixLength('www.ck', rules)).toBe(1);
  });
});

describe('known free second-level domain providers', () => {
  it('recognizes DNSHE supported suffixes', () => {
    expect(getFreeSubdomainProvider('demo.de5.net')).toBe('dnshe');
    expect(getFreeSubdomainProvider('demo.us.ci')).toBe('dnshe');
    expect(getFreeSubdomainProvider('demo.cc.cd')).toBe('dnshe');
    expect(getFreeSubdomainProvider('demo.bot.cd')).toBe('dnshe');
    expect(getFreeSubdomainProvider('demo.ccwu.cc')).toBe('dnshe');
  });

  it('does not mistake nested hosts for a registered free subdomain', () => {
    expect(getFreeSubdomainProvider('www.demo.de5.net')).toBe(null);
    expect(getFreeSubdomainProvider('www.demo.eu.org')).toBe(null);
  });

  it('keeps existing provider suffixes compatible', () => {
    expect(getFreeSubdomainProvider('demo.qzz.io')).toBe('digitalplat');
    expect(getFreeSubdomainProvider('demo.' + 'indevs.in')).toBe('stackryze');
    expect(getFreeSubdomainProvider('demo.eu.cc')).toBe('eu.cc');
    expect(getFreeSubdomainProvider('demo.eu.org')).toBe('manual-euorg');
    expect(getFreeSubdomainProvider('demo.pp.ua')).toBe('pp.ua');
  });
});


describe('renewal cycle normalization', () => {
  it('accepts a permanent renewal cycle without a numeric duration', () => {
    expect(sanitizeRenewCycle({ value: null, unit: 'permanent' })).toEqual({ value: null, unit: 'permanent' });
  });

  it('keeps existing year, month, and day cycles compatible', () => {
    expect(sanitizeRenewCycle({ value: 1, unit: 'year' })).toEqual({ value: 1, unit: 'year' });
    expect(sanitizeRenewCycle({ value: 6, unit: 'month' })).toEqual({ value: 6, unit: 'month' });
    expect(sanitizeRenewCycle({ value: 30, unit: 'day' })).toEqual({ value: 30, unit: 'day' });
  });
});
