"use client";

import { useState } from "react";
import { ClientCard } from "./client-card";
import { useClientStore } from "@/lib/client-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Inbox } from "lucide-react";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export function ClientsGrid() {
  const clients = useClientStore((state) => state.clients);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filteredClients = clients.filter((client) => {
    const matchesFilter = filter === "all" || client.status === filter;
    const matchesSearch =
      search === "" ||
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.companyName.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = clients.filter((c) => c.status === "pending").length;
  const approvedCount = clients.filter((c) => c.status === "approved").length;
  const rejectedCount = clients.filter((c) => c.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as FilterStatus)}
        >
          <TabsList className="bg-secondary">
            <TabsTrigger value="all" className="data-[state=active]:bg-background">
              Todos ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-background">
              Pendientes ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-background">
              Aprobados ({approvedCount})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-background">
              Rechazados ({rejectedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Inbox size={32} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            No se encontraron clientes
          </h3>
          <p className="text-muted-foreground text-sm">
            {search
              ? "Intenta con otros términos de búsqueda"
              : "No hay clientes con el filtro seleccionado"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
