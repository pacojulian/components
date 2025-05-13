interface Endpoint {
  path: string;
  method: string;
  operations?: string[];
}

interface Service {
  serviceName: string;
  endpoints: Endpoint[];
}

interface StructuredData {
  id: string;
  services: Service[];
}

function parseStringsToStructuredData(data: string[]): StructuredData[] {
  const result: Record<string, StructuredData> = {};

  data.forEach((line) => {
    const parts = line.split(",").map(p => p.trim());

    const [id, serviceName, methodEndpoint, operation] = parts;
    const [method, endpointName] = methodEndpoint.split(" ").map(p => p.trim());
    const isSoap = parts.length === 4;

    if (!result[id]) {
      result[id] = {
        id,
        services: [],
      };
    }

    let service = result[id].services.find(s => s.serviceName === serviceName);
    if (!service) {
      service = { serviceName, endpoints: [] };
      result[id].services.push(service);
    }

    let endpoint = service.endpoints.find(e => e.path === endpointName && e.method === method);
    if (!endpoint) {
      endpoint = { path: endpointName, method };
      service.endpoints.push(endpoint);
    }

    if (isSoap && operation) {
      if (!endpoint.operations) endpoint.operations = [];
      endpoint.operations.push(operation);
    }
  });

  return Object.values(result);
}
