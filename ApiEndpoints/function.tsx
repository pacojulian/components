type OperationType = "rest" | "soap";

interface Endpoint {
  name: string;
  operations?: string[];
}

interface Service {
  serviceName: string;
  endpoints: Endpoint[];
}

interface StructuredData {
  id: string;
  method: OperationType;
  services: Service[];
}

function parseStringsToStructuredData(data: string[]): StructuredData[] {
  const result: Record<string, StructuredData> = {};

  data.forEach((line) => {
    const parts = line.split(",").map(p => p.trim());

    const [id, serviceName, methodEndpoint, operation] = parts;
    const [methodRaw, endpointName] = methodEndpoint.split(" ").map(p => p.trim());
    const isSoap = parts.length === 4;
    const method: OperationType = isSoap ? "soap" : "rest";

    // Ensure ID group exists
    if (!result[id]) {
      result[id] = {
        id,
        method,
        services: [],
      };
    }

    let service = result[id].services.find(s => s.serviceName === serviceName);
    if (!service) {
      service = { serviceName, endpoints: [] };
      result[id].services.push(service);
    }

    let endpoint = service.endpoints.find(e => e.name === endpointName);
    if (!endpoint) {
      endpoint = { name: endpointName };
      service.endpoints.push(endpoint);
    }

    if (isSoap && operation) {
      if (!endpoint.operations) endpoint.operations = [];
      endpoint.operations.push(operation);
    }
  });

  return Object.values(result);
}
