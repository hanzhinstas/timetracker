import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import { HttpService } from '../services/http.service'
import { AccountService } from './account.service'
import { RemoteAccount, UserData, IssueDetails, WorkItemData } from 'app/models/RemoteAccount';

@Injectable()
export class ApiService {

  constructor(
    public http: HttpService,
    public accounts: AccountService
  ) {
    this.UseAccount();
  }

  public async UseAccount(remoteAccount?: RemoteAccount) {
    if (remoteAccount == undefined) {
      var remoteAccount = await this.accounts.Current();
    }
    if (remoteAccount != undefined) {
      this.http.UseAccount(remoteAccount);
    }
    return;
  }

  public getAllProjects = () => {
    return new Promise(resolve => {
      this.UseAccount().then(() => {
        this.http.get('/rest/admin/project')
          .map(res => res.json())
          .subscribe(data => {
            resolve(data);
          }, error => {
            resolve(error)
          });
      });
    });
  }

  public getVersionInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.getRawUrl("https://api.github.com/repos/hanzhinstas/timetracker/releases/latest")
      .map(res => res.json())
      .subscribe(data => {
        resolve(data);
      }, err => reject(err))
    })
  }

  private encodeQueryData(data) {
    let ret = [];
    for (let d in data)
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    return ret.join('&');
  }

  public getCommandSuggestions(id: string, command: any) {
    return new Promise((resolve, reject) => {
      this.http.get('/rest/issue/' + id + '/execute/intellisense?'+this.encodeQueryData(command), undefined, false)
      .map(res => res.json())
      .subscribe(result => {
        resolve(result), error => { reject(error) }
      });
    });
  }

  public executeCommand(id: string, command: any) {
    return new Promise((resolve, reject) => {
      let options = new RequestOptions();
      options.headers = new Headers();
      options.headers.append('Content-Type', 'application/x-www-form-urlencoded')
      this.http.post('/rest/issue/' + id + '/execute/', this.encodeQueryData(command), options).subscribe(commandResult => {
        resolve(commandResult), error => { reject(error) }
      });
    });
  }

  public createIssueOnBoard(data, BoardName, state) {
    let id = "";
    return new Promise((resolve, reject) => {
      this.UseAccount().then(() => {
        this.http.put('/rest/issue?' + this.encodeQueryData(data), "")
          .subscribe(result => {
            let loc = result.headers.get('Location');
            id = loc.substr(loc.lastIndexOf('/') + 1);
            resolve(id);
          }, error => {
            reject(error)
          });
      })
    }).then(() => { this.executeCommand(id, { 'command': 'Assignee me Board ' + BoardName + ' Current sprint' }) })
    .then(() => {this.executeCommand(id, {'command': 'State ' + state})} )
  }

  public getAllAgiles = () => {
    return new Promise(resolve => {
      this.UseAccount().then(() => {
        this.http.get('/api/agiles?fields=name,id,projects(id,shortName,name),columnSettings(columns(presentation))&$top=100')
          .map(res => res.json())
          .subscribe(data => {
            resolve(data);
          }, error => {
            resolve(error)
          });
      });
    });
  }

  public getIssuesByProject = (id) => {
    return new Promise(resolve => {
      this.UseAccount().then(() => {
        this.http.get('/rest/issue/byproject/' + id + '?filter=for%3A+me')
          .map(res => res.json())
          .subscribe(data => {
            resolve(data)
          })
      })
    })
  }

  public getIssuesByAgile = (agileName) => {
    return new Promise(resolve => {
      this.UseAccount().then(() => {
        this.http.get('/rest/issue?filter=for:me+Board+' + agileName + ':+{Current+sprint}+%23Unresolved&max=100')
          .map(res => res.json())
          .subscribe(data => {
            resolve(data)
          })
      })
    })
  }

  public getIssue = (issueId) => {
    return new Promise<IssueDetails>(resolve => {
      this.UseAccount().then(() => {
        this.http.get('/rest/issue/' + issueId + '?wikifyDescription=true')
          .map(res => res.json())
          .subscribe(data => {
            resolve(data)
          })
      })
    })
  }

  public getSprintInfo = (agile) => {
    let query = agile.url.split("/youtrack")[1]
    return new Promise(resolve => {
      this.UseAccount().then(() => {
        this.http.get(query)
          .map(res => res.json())
          .subscribe(data => {
            resolve(data)
          })
      })
    })
  }

  public createNewWorkItem = (data: WorkItemData) => {
    let newItem = {
      date: data.date,
      duration: Math.round(data.duration / 60),
      description: "Added by T-REC App"
    }

    return new Promise(resolve => {
      this.UseAccount().then(() => {
        this.http.post('/rest/issue/' + data.issueId + '/timetracking/workitem', newItem)
          .subscribe(data => {
            resolve(data)
          }, error => {
            resolve(error)
          })
      })
    })
  }

  public getWorkItem = (issueId) => {
    return new Promise(resolve => {
      this.UseAccount().then(() => {
        this.http.get('/rest/issue/' + issueId + '/timetracking/workitem')
          .map(res => res.json())
          .subscribe(data => {
            resolve(data)
          })
      })
    })
  }

  public getTimetrackingWorkTypes = (projectId) => {
    return new Promise(resolve => {
      this.UseAccount().then(() => {
        this.http.get('/rest/admin/project/' + projectId + '/timetracking/worktype')
          .map(res => res.json())
          .subscribe(data => {
            resolve(data)
          })
      })
    })
  }

  public getCurrentUser(remoteAccount: RemoteAccount) {
    this.UseAccount(remoteAccount)
    this.http.UseAccount(remoteAccount)
    return new Promise((resolve, reject) => {
      this.http.get('/rest/user/current')
        .map(res => res.json())
        .subscribe(data => {
          resolve(data)
        }, error => {
          reject(error)
        }
        );
    })
  }

}