export class TFile {
    constructor(path, name) {
        this.path = path;
        this.name = name;
    }
}
export class App {
    constructor() {
        this.vault = {
            getAbstractFileByPath: jest.fn(),
            createFolder: jest.fn(),
        };
        this.metadataCache = {
            on: jest.fn(),
            off: jest.fn(),
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzaWRpYW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvYnNpZGlhbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLE9BQU8sS0FBSztJQUNkLFlBQW1CLElBQVksRUFBUyxJQUFZO1FBQWpDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxTQUFJLEdBQUosSUFBSSxDQUFRO0lBQUcsQ0FBQztDQUN6RDtBQUVELE1BQU0sT0FBTyxHQUFHO0lBQWhCO1FBQ0UsVUFBSyxHQUFHO1lBQ04scUJBQXFCLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUNoQyxZQUFZLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtTQUN4QixDQUFDO1FBQ0Ysa0JBQWEsR0FBRztZQUNkLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ2IsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7U0FDZixDQUFDO0lBQ0osQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIFRGaWxlIHtcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXRoOiBzdHJpbmcsIHB1YmxpYyBuYW1lOiBzdHJpbmcpIHt9XHJcbiAgfVxyXG4gIFxyXG4gIGV4cG9ydCBjbGFzcyBBcHAge1xyXG4gICAgdmF1bHQgPSB7XHJcbiAgICAgIGdldEFic3RyYWN0RmlsZUJ5UGF0aDogamVzdC5mbigpLFxyXG4gICAgICBjcmVhdGVGb2xkZXI6IGplc3QuZm4oKSxcclxuICAgIH07XHJcbiAgICBtZXRhZGF0YUNhY2hlID0ge1xyXG4gICAgICBvbjogamVzdC5mbigpLFxyXG4gICAgICBvZmY6IGplc3QuZm4oKSxcclxuICAgIH07XHJcbiAgfVxyXG4gICJdfQ==