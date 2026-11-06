export interface DomainStatusMeta {
  label: string;
  color: string;
}

export interface DnsInstruction {
  type: string;
  name: string;
  target: string;
  proxyNotice?: string;
}

export function getDomainStatusMeta(verified: boolean): DomainStatusMeta {
  if (verified) {
    return {
      label: 'Aktif & Terverifikasi',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  return {
    label: 'Menunggu Konfigurasi DNS',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  };
}

export function getDnsInstruction(
  provider: 'cloudflare' | 'godaddy' | 'general'
): DnsInstruction {
  const baseInstruction = {
    type: 'CNAME',
    name: 'feedback (atau subdomain pilihan Anda)',
    target: 'cname.katauser.com',
  };

  if (provider === 'cloudflare') {
    return {
      ...baseInstruction,
      proxyNotice:
        'Pastikan status Proxy diatur ke DNS Only (ikon awan abu-abu), bukan Proxied (awan oranye) agar sertifikat SSL Let\'s Encrypt dapat diterbitkan langsung.',
    };
  }

  return baseInstruction;
}

