import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { TAXA_REFERENCE } from '@/data/taxaReference';
import { cn, formatNumber } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

function phylumTone(phylum: string): BadgeTone {
  if (phylum === 'Chordata') return 'cyan';
  if (phylum === 'Arthropoda') return 'amber';
  return 'teal';
}

export function TaxaExplorerPage() {
  const [search, setSearch] = useState('');
  const [phylumFilter, setPhylumFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TAXA_REFERENCE.filter((taxon) => {
      if (phylumFilter !== 'all' && taxon.phylum !== phylumFilter) return false;
      if (!q) return true;
      return (
        taxon.name.toLowerCase().includes(q) ||
        taxon.phylum.toLowerCase().includes(q) ||
        taxon.exampleSpecies.some((sp) => sp.toLowerCase().includes(q)) ||
        taxon.habitatNote.toLowerCase().includes(q)
      );
    });
  }, [search, phylumFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Supported Marine Taxonomic Groups (8 Classes)
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Reference taxonomy mapping used by the DeepSea CNN+LSTM classifier across Chordata,
            Arthropoda, and Mollusca.
          </p>
        </div>

        <Link
          to="/classify"
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-medium text-white transition-colors whitespace-nowrap"
        >
          Classify sequence
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search taxon, species, or habitat..."
            aria-label="Search marine taxa"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101A2E] pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101A2E] p-1">
          {(['all', 'Chordata', 'Arthropoda', 'Mollusca'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPhylumFilter(p)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                phylumFilter === p
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              {p === 'all' ? 'All phyla' : p}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching taxa"
          description="Try clearing your search filter or selecting all phyla."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtered.map((taxon) => (
            <Card key={taxon.classId} className="flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    Class #{taxon.classId} · {taxon.rank}
                  </span>
                  <Badge tone={phylumTone(taxon.phylum)}>{taxon.phylum}</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {taxon.name}
                  </h3>
                  <p className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {taxon.lineage.join(' › ')}
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {taxon.habitatNote}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Example species
                  </span>
                  <p className="mt-0.5 text-xs italic text-slate-800 dark:text-slate-200 leading-snug">
                    {taxon.exampleSpecies.join(', ')}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  <span>Training corpus</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(taxon.trainingCount)} reads
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
